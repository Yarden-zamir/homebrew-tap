# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.4.tar.gz"
  sha256 "0310dc2940fdc51dc5b1c44dcfdd77b0916af1522391dfb2f1698903367c59f7"
  license "MIT"

  def install
    zsh_completion.install "_act"
  end

end
