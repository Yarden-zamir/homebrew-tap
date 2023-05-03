# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.26.tar.gz"
  sha256 "b18ad1b329871800578529030672448f243a2fa1c5bddd44a65c76e4913c2982"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
